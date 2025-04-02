
import { supabase } from '@/integrations/supabase/client';

export interface ForwardPrice {
  instrument: string;
  month: string;
  price: number;
}

// Function to get forward price for specified instrument and month
export const fetchForwardPrice = async (
  instrument: string,
  month: string
): Promise<number | null> => {
  try {
    // First, get the instrument ID
    const { data: instrumentData, error: instrumentError } = await supabase
      .from('pricing_instruments')
      .select('id')
      .eq('display_name', instrument)
      .single();
      
    if (instrumentError || !instrumentData) {
      console.error('Error fetching instrument ID:', instrumentError);
      return null;
    }

    // Parse the month string (e.g., "Apr-25") into a date
    const [monthAbbr, yearStr] = month.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.findIndex(m => m === monthAbbr);
    if (monthIndex === -1) return null;
    
    // Create a date for the first day of the month
    const year = 2000 + parseInt(yearStr); // Convert '25' to 2025
    const forwardDate = new Date(year, monthIndex, 1);
    
    // Format the date for the query
    const formattedDate = forwardDate.toISOString().split('T')[0];
    
    // Query forward_prices table to get the price
    const { data: priceData, error: priceError } = await supabase
      .from('forward_prices')
      .select('price')
      .eq('instrument_id', instrumentData.id)
      .eq('forward_month', formattedDate)
      .maybeSingle();
      
    if (priceError) {
      console.error('Error fetching forward price:', priceError);
      return null;
    }
    
    return priceData ? priceData.price : null;
  } catch (error) {
    console.error('Error in fetchForwardPrice:', error);
    return null;
  }
};

// Function to get all available forward months for instruments
export const fetchAvailableForwardMonths = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('forward_prices')
      .select('forward_month')
      .order('forward_month', { ascending: true });
      
    if (error || !data) {
      console.error('Error fetching forward months:', error);
      return [];
    }
    
    // Convert dates to "MMM-YY" format and remove duplicates
    const months = data.map(row => {
      const date = new Date(row.forward_month);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      });
    });
    
    return [...new Set(months)];
  } catch (error) {
    console.error('Error in fetchAvailableForwardMonths:', error);
    return [];
  }
};
