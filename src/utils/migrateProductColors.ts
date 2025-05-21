
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';
import { getCustomProductColors } from '@/utils/productColorUtils';

// Function to migrate existing product colors to the database
export const migrateProductColors = async () => {
  try {
    // Get all products from the database
    const { data: products, error } = await supabase
      .from('products')
      .select('name, color_class')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    // Get custom colors from localStorage
    const customColors = getCustomProductColors();
    
    // For each product, update its color if needed
    for (const product of products) {
      // Skip if the product already has a color_class
      if (product.color_class) {
        continue;
      }
      
      // Try to get color from localStorage first, then from PRODUCT_COLORS
      let colorClass = null;
      
      if (customColors[product.name]) {
        colorClass = customColors[product.name];
      } else if (PRODUCT_COLORS[product.name]) {
        colorClass = PRODUCT_COLORS[product.name];
      } else {
        // Default color if none found
        colorClass = 'bg-gray-500 text-white';
      }
      
      // Update the product in the database
      const { error: updateError } = await supabase
        .from('products')
        .update({ color_class: colorClass })
        .eq('name', product.name);
      
      if (updateError) {
        console.error(`Error updating color for ${product.name}:`, updateError);
      }
    }
    
    console.log('Product colors migration completed');
  } catch (err) {
    console.error('Error during product colors migration:', err);
  }
};
