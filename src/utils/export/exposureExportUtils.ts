
import { MonthlyExposure } from '@/types/exposure';
import { formatMonthCode } from '../dateUtils';

/**
 * Formats the exposure data for export
 * @param exposureData The exposure data to format
 * @param visibleCategories The categories to include
 * @param filteredProducts The products to include
 * @returns The formatted export data
 */
export const formatExposureForExport = (
  exposureData: MonthlyExposure[],
  visibleCategories: string[],
  filteredProducts: string[]
) => {
  // Format the data for Excel export
  const exportData = exposureData.map(monthData => {
    const rowData: Record<string, any> = {
      Month: monthData.month,
    };

    // Add columns for each product in each category
    filteredProducts.forEach(product => {
      const productData = monthData.products[product] || {
        physical: 0,
        pricing: 0,
        paper: 0,
        netExposure: 0
      };

      if (visibleCategories.includes('Physical')) {
        rowData[`Physical ${product}`] = productData.physical;
      }
      
      if (visibleCategories.includes('Pricing')) {
        rowData[`Pricing ${product}`] = productData.pricing;
      }
      
      if (visibleCategories.includes('Paper')) {
        rowData[`Paper ${product}`] = productData.paper;
      }
      
      if (visibleCategories.includes('Exposure')) {
        rowData[`Exposure ${product}`] = productData.netExposure;
      }
    });

    return rowData;
  });

  return exportData;
};

/**
 * Format a date range for display in export file names or headers
 * @param dateRange The date range to format
 * @returns Formatted date range string
 */
export const formatDateRangeForExport = (dateRange: { from?: Date, to?: Date } | undefined) => {
  if (!dateRange?.from) return 'All Dates';
  
  const fromMonth = formatMonthCode(dateRange.from);
  const toMonth = dateRange.to ? formatMonthCode(dateRange.to) : fromMonth;
  
  if (fromMonth === toMonth) {
    return fromMonth;
  }
  
  return `${fromMonth} to ${toMonth}`;
};
