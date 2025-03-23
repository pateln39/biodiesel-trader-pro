
import { toast } from 'sonner';

/**
 * Validate physical trade form before submission
 */
export const validatePhysicalTradeForm = (
  counterparty: string,
  physicalType: string,
  legs: any[]
): boolean => {
  // Check if counterparty is selected
  if (!counterparty) {
    toast.error('Please select a counterparty');
    return false;
  }

  // Check if physical type is selected
  if (!physicalType) {
    toast.error('Please select a physical trade type');
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
    
    if (!leg.incoTerm) {
      toast.error(`Leg ${i+1}: Please select an incoterm`);
      return false;
    }
    
    if (!leg.loadingPeriodStart || !leg.loadingPeriodEnd) {
      toast.error(`Leg ${i+1}: Please select loading period dates`);
      return false;
    }
    
    if (!leg.pricingPeriodStart || !leg.pricingPeriodEnd) {
      toast.error(`Leg ${i+1}: Please select pricing period dates`);
      return false;
    }
    
    if (!leg.unit) {
      toast.error(`Leg ${i+1}: Please select a unit`);
      return false;
    }
    
    if (!leg.paymentTerm) {
      toast.error(`Leg ${i+1}: Please select payment terms`);
      return false;
    }
    
    if (!leg.creditStatus) {
      toast.error(`Leg ${i+1}: Please select credit status`);
      return false;
    }
  }

  return true;
};
