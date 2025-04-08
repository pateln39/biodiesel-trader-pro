
import * as XLSX from 'xlsx';
import { formatExposureTableProduct, getExposureProductBackgroundClass } from './productMapping';

// Helper function to get Excel cell style based on value
const getExcelValueStyle = (value: number): any => {
  if (value > 0) {
    return { font: { color: { rgb: "00A65A" } } }; // Green for positive values
  } else if (value < 0) {
    return { font: { color: { rgb: "D73925" } } }; // Red for negative values
  }
  return { font: { color: { rgb: "888888" } } }; // Gray for zero values
};

// Helper function to format values for Excel
const formatExcelValue = (value: number): string | null => {
  if (value === 0) return "-";
  return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
};

// Create header cell style
const headerStyle: any = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "1A1F2C" } }, // Brand navy
  alignment: { horizontal: "right" }
};

const categoryHeaderStyle: any = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "1A1F2C" } }, // Brand navy
  alignment: { horizontal: "center" }
};

// Style for the title
const titleStyle: any = {
  font: { bold: true, sz: 16, underline: true },
  alignment: { horizontal: "center" }
};

/**
 * Exports exposure data to Excel
 */
export const exportExposureToExcel = (
  exposureData: any[],
  orderedVisibleCategories: string[],
  filteredProducts: string[],
  grandTotals: any,
  groupGrandTotals: any,
  BIODIESEL_PRODUCTS: string[],
  PRICING_INSTRUMENT_PRODUCTS: string[]
) => {
  // Define a function to get color classes based on value (similar to the one in UI)
  const getValueColorClass = (value: number): string => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-500';
  };

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Set column widths
  const wscols = [
    { wch: 8 }, // Month column width
    ...Array(100).fill({ wch: 12 }) // Other columns
  ];
  ws['!cols'] = wscols;
  
  // Add title
  const title = [["Exposure Reporting"]];
  XLSX.utils.sheet_add_aoa(ws, title, { origin: "A1" });
  
  // Apply title style
  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 30 }; // Height for title row
  
  // Create a merged cell for the title
  if (!ws['!merges']) ws['!merges'] = [];
  // Determine how many columns we need to merge for the title
  const totalColumns = orderedVisibleCategories.reduce((total, category) => {
    let colCount = filteredProducts.filter(product => 
      !(category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) &&
      !(category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP'))
    ).length;
    
    if (category === 'Exposure') {
      colCount += 3; // Add columns for Total Biodiesel, Total Pricing Instrument, and Total Row
    }
    
    return total + colCount;
  }, 0) + 1; // +1 for the Month column
  
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(totalColumns - 1, 10) } });
  
  // Apply title style
  if (!ws['!cells']) ws['!cells'] = {};
  ws['!cells']["A1"] = { t: "s", v: "Exposure Reporting", s: titleStyle };
  
  // Start building the data rows (starting at row 3 to leave space after title)
  const headerRow1 = ["Month"];
  let headerRow2: any[] = [""];
  let currentColIndex = 1;
  
  // Build the header rows
  orderedVisibleCategories.forEach((category, catIndex) => {
    const categoryProducts = filteredProducts.filter(product => 
      !(category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) &&
      !(category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP'))
    );
    
    let colSpan = categoryProducts.length;
    if (category === 'Exposure') {
      colSpan += 3; // Add columns for Total Biodiesel, Total Pricing Instrument, and Total Row
    }
    
    // Add to header row 1 (category names)
    headerRow1.push(category);
    
    // Set column span for category
    if (colSpan > 1) {
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ 
        s: { r: 2, c: currentColIndex }, 
        e: { r: 2, c: currentColIndex + colSpan - 1 } 
      });
    }
    
    // Add to header row 2 (product names)
    if (category === 'Exposure') {
      const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
      
      categoryProducts.forEach((product, index) => {
        headerRow2.push(formatExposureTableProduct(product));
        if (index === ucomeIndex) {
          headerRow2.push("Total Biodiesel");
        }
      });
      
      headerRow2.push("Total Pricing Instrument");
      headerRow2.push("Total Row");
    } else {
      categoryProducts.forEach(product => {
        headerRow2.push(formatExposureTableProduct(product));
      });
    }
    
    currentColIndex += colSpan;
  });
  
  // Add header rows to worksheet
  XLSX.utils.sheet_add_aoa(ws, [headerRow1], { origin: "A3" });
  XLSX.utils.sheet_add_aoa(ws, [headerRow2], { origin: "A4" });
  
  // Apply styles to header rows
  for (let i = 0; i < headerRow1.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: i });
    if (!ws['!cells']) ws['!cells'] = {};
    ws['!cells'][cellRef] = {
      t: "s",
      v: headerRow1[i],
      s: categoryHeaderStyle
    };
  }
  
  for (let i = 0; i < headerRow2.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 3, c: i });
    if (!ws['!cells']) ws['!cells'] = {};
    ws['!cells'][cellRef] = {
      t: "s",
      v: headerRow2[i],
      s: headerStyle
    };
  }
  
  // Add data rows
  const dataRows: any[][] = [];
  
  // Add exposure data rows
  exposureData.forEach((monthData, rowIndex) => {
    const row = [monthData.month];
    let colIndex = 1;
    
    orderedVisibleCategories.forEach(category => {
      const categoryProducts = filteredProducts.filter(product => 
        !(category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) &&
        !(category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP'))
      );
      
      if (category === 'Physical') {
        categoryProducts.forEach(product => {
          const value = monthData.products[product]?.physical || 0;
          row.push(formatExcelValue(value));
          
          // Apply cell style based on value
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
          if (!ws['!cells']) ws['!cells'] = {};
          ws['!cells'][cellRef] = {
            t: "s",
            v: formatExcelValue(value) || "",
            s: getExcelValueStyle(value)
          };
          colIndex++;
        });
      } else if (category === 'Pricing') {
        categoryProducts.forEach(product => {
          const value = monthData.products[product]?.pricing || 0;
          row.push(formatExcelValue(value));
          
          // Apply cell style based on value
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
          if (!ws['!cells']) ws['!cells'] = {};
          ws['!cells'][cellRef] = {
            t: "s",
            v: formatExcelValue(value) || "",
            s: getExcelValueStyle(value)
          };
          colIndex++;
        });
      } else if (category === 'Paper') {
        categoryProducts.forEach(product => {
          const value = monthData.products[product]?.paper || 0;
          row.push(formatExcelValue(value));
          
          // Apply cell style based on value
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
          if (!ws['!cells']) ws['!cells'] = {};
          ws['!cells'][cellRef] = {
            t: "s",
            v: formatExcelValue(value) || "",
            s: getExcelValueStyle(value)
          };
          colIndex++;
        });
      } else if (category === 'Exposure') {
        const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
        
        categoryProducts.forEach((product, index) => {
          const value = monthData.products[product]?.netExposure || 0;
          row.push(formatExcelValue(value));
          
          // Apply cell style based on value
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
          if (!ws['!cells']) ws['!cells'] = {};
          ws['!cells'][cellRef] = {
            t: "s",
            v: formatExcelValue(value) || "",
            s: getExcelValueStyle(value)
          };
          colIndex++;
          
          // Add Total Biodiesel column after UCOME
          if (index === ucomeIndex) {
            const biodieselTotal = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS);
            row.push(formatExcelValue(biodieselTotal));
            
            // Apply cell style
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
            if (!ws['!cells']) ws['!cells'] = {};
            ws['!cells'][cellRef] = {
              t: "s",
              v: formatExcelValue(biodieselTotal) || "",
              s: getExcelValueStyle(biodieselTotal)
            };
            colIndex++;
          }
        });
        
        // Add Total Pricing Instrument column
        const pricingInstrumentTotal = calculateProductGroupTotal(monthData.products, PRICING_INSTRUMENT_PRODUCTS);
        row.push(formatExcelValue(pricingInstrumentTotal));
        
        // Apply cell style
        const cellRef1 = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
        if (!ws['!cells']) ws['!cells'] = {};
        ws['!cells'][cellRef1] = {
          t: "s",
          v: formatExcelValue(pricingInstrumentTotal) || "",
          s: getExcelValueStyle(pricingInstrumentTotal)
        };
        colIndex++;
        
        // Add Total Row column
        const biodieselTotal = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS);
        const totalRow = biodieselTotal + pricingInstrumentTotal;
        row.push(formatExcelValue(totalRow));
        
        // Apply cell style
        const cellRef2 = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
        if (!ws['!cells']) ws['!cells'] = {};
        ws['!cells'][cellRef2] = {
          t: "s",
          v: formatExcelValue(totalRow) || "",
          s: getExcelValueStyle(totalRow)
        };
        colIndex++;
      }
    });
    
    dataRows.push(row);
  });
  
  // Add all data rows to the worksheet
  XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A5" });
  
  // Add Total row at the bottom
  const totalRow = ["Total"];
  let colIndex = 1;
  
  orderedVisibleCategories.forEach(category => {
    const categoryProducts = filteredProducts.filter(product => 
      !(category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) &&
      !(category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP'))
    );
    
    if (category === 'Physical') {
      categoryProducts.forEach(product => {
        const value = grandTotals.productTotals[product]?.physical || 0;
        totalRow.push(formatExcelValue(value));
        
        // Apply cell style based on value
        const cellRef = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: colIndex });
        if (!ws['!cells']) ws['!cells'] = {};
        ws['!cells'][cellRef] = {
          t: "s",
          v: formatExcelValue(value) || "",
          s: {
            ...getExcelValueStyle(value),
            font: { bold: true, color: getExcelValueStyle(value).font?.color }
          }
        };
        colIndex++;
      });
    } else if (category === 'Pricing') {
      categoryProducts.forEach(product => {
        const value = grandTotals.productTotals[product]?.pricing || 0;
        totalRow.push(formatExcelValue(value));
        
        // Apply cell style based on value
        const cellRef = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: colIndex });
        if (!ws['!cells']) ws['!cells'] = {};
        ws['!cells'][cellRef] = {
          t: "s",
          v: formatExcelValue(value) || "",
          s: {
            ...getExcelValueStyle(value),
            font: { bold: true, color: getExcelValueStyle(value).font?.color }
          }
        };
        colIndex++;
      });
    } else if (category === 'Paper') {
      categoryProducts.forEach(product => {
        const value = grandTotals.productTotals[product]?.paper || 0;
        totalRow.push(formatExcelValue(value));
        
        // Apply cell style based on value
        const cellRef = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: colIndex });
        if (!ws['!cells']) ws['!cells'] = {};
        ws['!cells'][cellRef] = {
          t: "s",
          v: formatExcelValue(value) || "",
          s: {
            ...getExcelValueStyle(value),
            font: { bold: true, color: getExcelValueStyle(value).font?.color }
          }
        };
        colIndex++;
      });
    } else if (category === 'Exposure') {
      const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
      
      categoryProducts.forEach((product, index) => {
        const value = grandTotals.productTotals[product]?.netExposure || 0;
        totalRow.push(formatExcelValue(value));
        
        // Apply cell style based on value
        const cellRef = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: colIndex });
        if (!ws['!cells']) ws['!cells'] = {};
        ws['!cells'][cellRef] = {
          t: "s",
          v: formatExcelValue(value) || "",
          s: {
            ...getExcelValueStyle(value),
            font: { bold: true, color: getExcelValueStyle(value).font?.color }
          }
        };
        colIndex++;
        
        // Add Total Biodiesel column after UCOME
        if (index === ucomeIndex) {
          totalRow.push(formatExcelValue(groupGrandTotals.biodieselTotal));
          
          // Apply cell style
          const cellRef = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: colIndex });
          if (!ws['!cells']) ws['!cells'] = {};
          ws['!cells'][cellRef] = {
            t: "s",
            v: formatExcelValue(groupGrandTotals.biodieselTotal) || "",
            s: {
              ...getExcelValueStyle(groupGrandTotals.biodieselTotal),
              font: { bold: true, color: getExcelValueStyle(groupGrandTotals.biodieselTotal).font?.color }
            }
          };
          colIndex++;
        }
      });
      
      // Add Total Pricing Instrument column
      totalRow.push(formatExcelValue(groupGrandTotals.pricingInstrumentTotal));
      
      // Apply cell style
      const cellRef1 = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: colIndex });
      if (!ws['!cells']) ws['!cells'] = {};
      ws['!cells'][cellRef1] = {
        t: "s",
        v: formatExcelValue(groupGrandTotals.pricingInstrumentTotal) || "",
        s: {
          ...getExcelValueStyle(groupGrandTotals.pricingInstrumentTotal),
          font: { bold: true, color: getExcelValueStyle(groupGrandTotals.pricingInstrumentTotal).font?.color }
        }
      };
      colIndex++;
      
      // Add Total Row column
      totalRow.push(formatExcelValue(groupGrandTotals.totalRow));
      
      // Apply cell style
      const cellRef2 = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: colIndex });
      if (!ws['!cells']) ws['!cells'] = {};
      ws['!cells'][cellRef2] = {
        t: "s",
        v: formatExcelValue(groupGrandTotals.totalRow) || "",
        s: {
          ...getExcelValueStyle(groupGrandTotals.totalRow),
          font: { bold: true, color: getExcelValueStyle(groupGrandTotals.totalRow).font?.color }
        }
      };
      colIndex++;
    }
  });
  
  // Add Total row to the worksheet
  XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: `A${exposureData.length + 5}` });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Exposure Report");
  
  // Generate the Excel file name with the current date
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0];
  const fileName = `Exposure_Report_${formattedDate}.xlsx`;
  
  // Write and download the Excel file
  XLSX.writeFile(wb, fileName);
};

// Helper function to calculate product group total
const calculateProductGroupTotal = (
  monthProducts: Record<string, any>, 
  productGroup: string[], 
  category: string = 'netExposure'
): number => {
  return productGroup.reduce((total, product) => {
    if (monthProducts[product]) {
      return total + (monthProducts[product][category] || 0);
    }
    return total;
  }, 0);
};
