
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ExposureExportParams } from './exposureExportTypes';
import {
  columnHeaderBorderStyle,
  dataBorderStyle,
  sumRowBorderStyle,
  totalRowBorderStyle,
  exportStyles,
  addConditionalStyle
} from './excelFormatUtils';

/**
 * Export exposure data to Excel
 * 
 * This function takes the current state of the exposure table and exports it to Excel.
 * It includes all visible categories and products, and formats the data with conditional
 * formatting for positive/negative values.
 * 
 * @param params Export parameters including data, visible categories, and product filters
 */
export const exportExposureToExcel = (params: ExposureExportParams) => {
  try {
    console.log('[EXPORT] Starting exposure data export');
    const {
      exposureData,
      visibleCategories,
      filteredProducts,
      grandTotals,
      groupGrandTotals,
      biodieselProducts,
      pricingInstrumentProducts,
      dateRange
    } = params;
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare columns based on visible categories
    const columns = [{ key: 'product', header: 'Product' }];
    const monthColumns: string[] = [];
    
    // Add month columns for each visible category
    exposureData.forEach(monthData => {
      visibleCategories.forEach(category => {
        const columnKey = `${monthData.month}-${category.toLowerCase()}`;
        columns.push({ key: columnKey, header: `${monthData.month} ${category}` });
        monthColumns.push(columnKey);
      });
    });
    
    // Add total columns
    visibleCategories.forEach(category => {
      const columnKey = `total-${category.toLowerCase()}`;
      columns.push({ key: columnKey, header: `Total ${category}` });
    });
    
    // Create data rows for each product
    const rows: any[] = [];
    
    // Filter products based on user selection
    const productsToShow = filteredProducts;
    
    // Add product rows
    productsToShow.forEach(product => {
      const row: any = { product };
      
      // Add data for each month and category
      exposureData.forEach(monthData => {
        const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
        
        visibleCategories.forEach(category => {
          const key = `${monthData.month}-${category.toLowerCase()}`;
          const value = category === 'Physical' ? productData.physical
            : category === 'Pricing' ? productData.pricing
            : category === 'Paper' ? productData.paper
            : productData.netExposure;
          
          row[key] = value !== 0 ? value : '';
        });
      });
      
      // Add totals for each category
      visibleCategories.forEach(category => {
        const key = `total-${category.toLowerCase()}`;
        const value = category === 'Physical' ? grandTotals.productTotals[product]?.physical || 0
          : category === 'Pricing' ? grandTotals.productTotals[product]?.pricing || 0
          : category === 'Paper' ? grandTotals.productTotals[product]?.paper || 0
          : grandTotals.productTotals[product]?.netExposure || 0;
        
        row[key] = value !== 0 ? value : '';
      });
      
      rows.push(row);
    });
    
    // Add group totals
    // Add a blank row
    rows.push({});
    
    // Add Biodiesel total row
    const biodieselRow: any = { product: 'Biodiesel Total' };
    let isBiodieselRowEmpty = true;
    
    exposureData.forEach(monthData => {
      let biodieselMonthTotal = 0;
      
      biodieselProducts.forEach(product => {
        const productData = monthData.products[product];
        if (productData?.netExposure) {
          biodieselMonthTotal += productData.netExposure;
          isBiodieselRowEmpty = false;
        }
      });
      
      if (visibleCategories.includes('Exposure')) {
        biodieselRow[`${monthData.month}-exposure`] = biodieselMonthTotal !== 0 ? biodieselMonthTotal : '';
      }
      
      // Add empty cells for other categories
      ['physical', 'pricing', 'paper'].forEach(cat => {
        if (visibleCategories.includes(cat.charAt(0).toUpperCase() + cat.slice(1) as any)) {
          biodieselRow[`${monthData.month}-${cat}`] = '';
        }
      });
    });
    
    if (visibleCategories.includes('Exposure')) {
      biodieselRow['total-exposure'] = groupGrandTotals.biodieselTotal !== 0 ? groupGrandTotals.biodieselTotal : '';
    }
    
    // Add empty cells for other categories' totals
    ['physical', 'pricing', 'paper'].forEach(cat => {
      if (visibleCategories.includes(cat.charAt(0).toUpperCase() + cat.slice(1) as any)) {
        biodieselRow[`total-${cat}`] = '';
      }
    });
    
    if (!isBiodieselRowEmpty) {
      rows.push(biodieselRow);
    }
    
    // Add Pricing Instruments total row
    const instrumentsRow: any = { product: 'Pricing Instruments Total' };
    let isInstrumentsRowEmpty = true;
    
    exposureData.forEach(monthData => {
      let instrumentsMonthTotal = 0;
      
      pricingInstrumentProducts.forEach(product => {
        const productData = monthData.products[product];
        if (productData?.netExposure) {
          instrumentsMonthTotal += productData.netExposure;
          isInstrumentsRowEmpty = false;
        }
      });
      
      if (visibleCategories.includes('Exposure')) {
        instrumentsRow[`${monthData.month}-exposure`] = instrumentsMonthTotal !== 0 ? instrumentsMonthTotal : '';
      }
      
      // Add empty cells for other categories
      ['physical', 'pricing', 'paper'].forEach(cat => {
        if (visibleCategories.includes(cat.charAt(0).toUpperCase() + cat.slice(1) as any)) {
          instrumentsRow[`${monthData.month}-${cat}`] = '';
        }
      });
    });
    
    if (visibleCategories.includes('Exposure')) {
      instrumentsRow['total-exposure'] = groupGrandTotals.pricingInstrumentTotal !== 0 ? groupGrandTotals.pricingInstrumentTotal : '';
    }
    
    // Add empty cells for other categories' totals
    ['physical', 'pricing', 'paper'].forEach(cat => {
      if (visibleCategories.includes(cat.charAt(0).toUpperCase() + cat.slice(1) as any)) {
        instrumentsRow[`total-${cat}`] = '';
      }
    });
    
    if (!isInstrumentsRowEmpty) {
      rows.push(instrumentsRow);
    }
    
    // Add another blank row
    rows.push({});
    
    // Add total row
    const totalRow: any = { product: 'Total' };
    
    // Add total for each month and category
    exposureData.forEach(monthData => {
      visibleCategories.forEach(category => {
        const key = `${monthData.month}-${category.toLowerCase()}`;
        const value = category === 'Physical' ? monthData.totals.physical
          : category === 'Pricing' ? monthData.totals.pricing
          : category === 'Paper' ? monthData.totals.paper
          : monthData.totals.netExposure;
        
        totalRow[key] = value !== 0 ? value : '';
      });
    });
    
    // Add grand totals
    visibleCategories.forEach(category => {
      const key = `total-${category.toLowerCase()}`;
      const value = category === 'Physical' ? grandTotals.totals.physical
        : category === 'Pricing' ? grandTotals.totals.pricing
        : category === 'Paper' ? grandTotals.totals.paper
        : grandTotals.totals.netExposure;
      
      totalRow[key] = value !== 0 ? value : '';
    });
    
    rows.push(totalRow);
    
    // Generate worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(rows, { 
      header: columns.map(col => col.key)
    });
    
    // Set column headers
    const headerRow: any = {};
    columns.forEach(col => {
      headerRow[col.key] = col.header;
    });
    
    XLSX.utils.sheet_add_json(worksheet, [headerRow], {
      header: columns.map(col => col.key),
      skipHeader: true,
      origin: 'A1'
    });
    
    // Apply cell formatting
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Set column widths
    const colWidths: Record<string, number> = {};
    columns.forEach((col, index) => {
      colWidths[index] = col.key === 'product' ? 20 : 15;
    });
    
    worksheet['!cols'] = Object.keys(colWidths).map(key => ({ 
      wch: colWidths[parseInt(key)] 
    }));
    
    // Apply cell styles
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
      worksheet[headerCell].s = columnHeaderBorderStyle;
      
      for (let row = 1; row <= rows.length; row++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        
        // Skip if cell doesn't exist
        if (!worksheet[cell]) continue;
        
        // Apply different styles based on row type
        if (row === rows.length) {
          // Total row
          worksheet[cell].s = totalRowBorderStyle;
        } else if (rows[row - 1]?.product === 'Biodiesel Total' || rows[row - 1]?.product === 'Pricing Instruments Total') {
          // Group total rows
          worksheet[cell].s = sumRowBorderStyle;
        } else {
          // Regular data rows
          worksheet[cell].s = dataBorderStyle;
          
          // Apply conditional formatting for numeric cells
          const value = worksheet[cell].v;
          if (typeof value === 'number') {
            worksheet[cell].s = addConditionalStyle(value, dataBorderStyle);
          }
        }
      }
    }
    
    // Generate file name with date and time
    let fileName = 'Exposure_Report';
    
    // Add date range to filename if applicable
    if (dateRange?.from) {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromDate;
      fileName += `_${fromDate}_to_${toDate}`;
    }
    
    fileName += `_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exposure Report');
    
    // Write file and trigger download
    XLSX.writeFile(workbook, fileName);
    console.log('[EXPORT] Export complete:', fileName);
    return true;
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};
