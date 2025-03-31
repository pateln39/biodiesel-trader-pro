
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches the previous day's price for a given instrument
 * Used for EFP pricing calculations
 */
export async function fetchPreviousDayPrice(
  instrument: string
): Promise<{ price: number; date: Date } | null> {
  // Get instrument ID first
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('instrument_code', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error('Error fetching instrument:', instrumentError);
    return null;
  }

  // Now get the most recent price
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  
  const { data, error } = await supabase
    .from('historical_prices')
    .select('price, price_date')
    .eq('instrument_id', instrumentData.id)
    .lt('price_date', today.toISOString().split('T')[0])
    .order('price_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching historical price:', error);
    return null;
  }

  return {
    price: data.price,
    date: new Date(data.price_date)
  };
}

/**
 * Helper function to get available months for EFP designated month selection
 * Returns an array of months in MMM-YY format for the next 12 months
 */
export function getAvailableEfpMonths(): string[] {
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Generate the next 12 months
  for (let i = 0; i < 12; i++) {
    const month = (currentMonth + i) % 12;
    const year = currentYear + Math.floor((currentMonth + i) / 12);
    const twoDigitYear = (year % 100).toString().padStart(2, '0');
    months.push(`${monthNames[month]}-${twoDigitYear}`);
  }
  
  return months;
}
