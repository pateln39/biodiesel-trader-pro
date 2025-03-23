
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PriceData {
  instrument: string;
  date: string;
  price: number;
}

export const uploadPriceData = async (prices: PriceData[]): Promise<boolean> => {
  try {
    // First, get all the pricing instruments to map them to IDs
    const { data: instruments, error: instrumentsError } = await supabase
      .from('pricing_instruments')
      .select('id, instrument_code');
    
    if (instrumentsError) {
      throw new Error(`Error fetching instruments: ${instrumentsError.message}`);
    }

    // Create a mapping of instrument code to ID
    const instrumentMap = new Map<string, string>();
    instruments.forEach((inst: any) => {
      instrumentMap.set(inst.instrument_code, inst.id);
    });

    // Prepare data for historical_prices table
    const historicalPriceData = prices.map(price => ({
      instrument_id: instrumentMap.get(price.instrument),
      price_date: price.date,
      price: price.price
    }));

    // Insert into historical_prices
    const { error: uploadError } = await supabase
      .from('historical_prices')
      .insert(historicalPriceData);

    if (uploadError) {
      throw new Error(`Error uploading prices: ${uploadError.message}`);
    }

    toast.success('Prices uploaded successfully!');
    return true;
  } catch (error: any) {
    console.error('Error uploading prices:', error);
    toast.error('Failed to upload prices', {
      description: error.message
    });
    return false;
  }
}
