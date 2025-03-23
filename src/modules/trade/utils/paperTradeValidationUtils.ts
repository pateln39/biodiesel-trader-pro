
import { toast } from 'sonner';

/**
 * Validate paper trade form before submission
 */
export const validatePaperTradeForm = (
  broker: string,
  legs: any[]
): boolean => {
  // Check if broker is selected
  if (!broker) {
    toast.error('Please select a broker');
    return false;
  }

  // Check if at least one leg is added
  if (legs.length === 0) {
    toast.error('Please add at least one trade leg');
    return false;
  }

  // Validate each leg
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    
    // Check required fields
    if (!leg.product) {
      toast.error(`Leg ${i+1}: Please select a product`);
      return false;
    }
    
    if (!leg.quantity || leg.quantity <= 0) {
      toast.error(`Leg ${i+1}: Please enter a valid quantity`);
      return false;
    }
    
    if (!leg.period) {
      toast.error(`Leg ${i+1}: Please select a period`);
      return false;
    }
    
    // If it's a spread or diff, check the right side
    if (leg.relationshipType === 'DIFF' || leg.relationshipType === 'SPREAD') {
      if (!leg.rightSide || !leg.rightSide.product) {
        toast.error(`Leg ${i+1}: Right side product is required for ${leg.relationshipType}`);
        return false;
      }
    }
  }

  return true;
};
