
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ExposureExportParams } from './exposureExportTypes';
import { 
  applyWorksheetStyles, 
  applyCellMerges, 
  generateExcelFileName 
} from './excelFormatUtils';

/**
 * Export exposure data to Excel
 * @param params - Exposure export parameters
 */
export const exportExposureToExcel = (params: ExposureExportParams): void => {
  try {
    console.log('[EXPORT] Starting exposure data export');
    const {
      exposureData,
      visibleCategories,
      filteredProducts,
      grandTotals,
      groupGrandTotals,
      biodieselProducts,
      pricingInstrumentProducts
    } = params;
    
    const workbook = XLSX.utils.book_new();
    
    // Create header rows
    const categoryRow: any[] = [{ v: "", t: 's' }];
    const productRow: any[] = [{ v: "Month", t: 's' }];
    const categorySpans: number[] = [];
    
    // Generate category headers
    visibleCategories.forEach(category => {
      const categoryProducts = filteredProducts.filter(product => {
        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
          return false;
        }
        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
          return false;
        }
        return true;
      });
      
      categoryRow.push({ 
        v: category, 
        t: 's',
        s: { 
          alignment: { 
            horizontal: 'center', 
            vertical: 'center' 
          },
          font: { bold: true }
        }
      });
      
      let spanCount = categoryProducts.length;
      
      if (category === 'Exposure') {
        spanCount += 3; // For biodiesel total, pricing instrument total, and grand total
      }
      
      categorySpans.push(spanCount);
      
      // Add empty cells for merging
      for (let i = 1; i < spanCount; i++) {
        categoryRow.push({ v: "", t: 's' });
      }
      
      // Add product headers
      categoryProducts.forEach(product => {
        productRow.push({ v: product, t: 's' });
      });
      
      // Add totals headers for Exposure category
      if (category === 'Exposure') {
        productRow.push({ v: "Biodiesel Total", t: 's' });
        productRow.push({ v: "Pricing Instrument Total", t: 's' });
        productRow.push({ v: "Total Row", t: 's' });
      }
    });
    
    // Create data rows for each month
    const dataRows: any[][] = [];
    
    exposureData.forEach(monthData => {
      const dataRow: any[] = [{ v: monthData.month, t: 's' }];
      
      visibleCategories.forEach(category => {
        const categoryProducts = filteredProducts.filter(product => {
          if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
            return false;
          }
          if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
            return false;
          }
          return true;
        });
        
        // Add product values
        categoryProducts.forEach(product => {
          if (!monthData.products || typeof monthData.products !== 'object') {
            dataRow.push({ v: 0, t: 'n' });
            return;
          }
          
          const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
          
          let value = 0;
          if (category === 'Physical') value = productData.physical;
          else if (category === 'Pricing') value = productData.pricing;
          else if (category === 'Paper') value = productData.paper;
          else if (category === 'Exposure') value = productData.netExposure;
          
          dataRow.push({ v: value, t: 'n' });
        });
        
        // Add totals for Exposure category
        if (category === 'Exposure') {
          let biodieselTotal = 0;
          let pricingInstrumentTotal = 0;
          
          if (monthData.products && typeof monthData.products === 'object') {
            biodieselTotal = biodieselProducts.reduce((total, product) => {
              if (monthData.products[product]) {
                return total + monthData.products[product].netExposure;
              }
              return total;
            }, 0);
            
            pricingInstrumentTotal = pricingInstrumentProducts.reduce((total, product) => {
              if (monthData.products[product]) {
                return total + monthData.products[product].netExposure;
              }
              return total;
            }, 0);
          }
          
          dataRow.push({ v: biodieselTotal, t: 'n' });
          dataRow.push({ v: pricingInstrumentTotal, t: 'n' });
          dataRow.push({ v: biodieselTotal + pricingInstrumentTotal, t: 'n' });
        }
      });
      
      dataRows.push(dataRow);
    });
    
    // Create totals row
    const totalsRow: any[] = [{ v: "Total", t: 's' }];
    
    visibleCategories.forEach(category => {
      const categoryProducts = filteredProducts.filter(product => {
        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
          return false;
        }
        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
          return false;
        }
        return true;
      });
      
      // Add product totals
      categoryProducts.forEach(product => {
        let value = 0;
        if (grandTotals.productTotals[product]) {
          if (category === 'Physical') value = grandTotals.productTotals[product].physical;
          else if (category === 'Pricing') value = grandTotals.productTotals[product].pricing;
          else if (category === 'Paper') value = grandTotals.productTotals[product].paper;
          else if (category === 'Exposure') value = grandTotals.productTotals[product].netExposure;
        }
        
        totalsRow.push({ v: value, t: 'n' });
      });
      
      // Add group totals for Exposure category
      if (category === 'Exposure') {
        totalsRow.push({ v: groupGrandTotals.biodieselTotal, t: 'n' });
        totalsRow.push({ v: groupGrandTotals.pricingInstrumentTotal, t: 'n' });
        totalsRow.push({ v: groupGrandTotals.totalRow, t: 'n' });
      }
    });
    
    dataRows.push(totalsRow);
    
    // Combine all rows and create sheet
    const allRows = [categoryRow, productRow, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);
    
    // Merge category header cells
    let colIndex = 1;
    const mergeRanges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];
    
    categorySpans.forEach(span => {
      mergeRanges.push({
        s: { r: 0, c: colIndex },
        e: { r: 0, c: colIndex + span - 1 }
      });
      colIndex += span;
    });
    
    applyCellMerges(worksheet, mergeRanges);
    
    // Style the worksheet
    applyWorksheetStyles(worksheet, 2, true);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exposure');
    
    // Generate filename with current date
    const fileName = generateExcelFileName('Exposure');
    
    // Write the workbook to a file
    XLSX.writeFile(workbook, fileName);
    console.log(`[EXPORT] Successfully exported exposure data to ${fileName}`);
    
  } catch (error) {
    console.error('[EXPORT] Failed to export exposure data:', error);
    throw error;
  }
};
