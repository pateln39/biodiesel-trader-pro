import * as XLSX from 'xlsx';
import { formatExposureTableProduct, getExposureProductBackgroundClass } from './productMapping';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { format } from 'date-fns';

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

// Create header cell style with explicit border definitions and patternType for fill
const headerStyle: any = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: "1A1F2C" } },
  alignment: { horizontal: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

const categoryHeaderStyle: any = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: "1A1F2C" } },
  alignment: { horizontal: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

// Style for the title with explicit font size and alignment
const titleStyle: any = {
  font: { bold: true, sz: 24, underline: true },
  alignment: { horizontal: "center" }
};

// Define category background colors matching UI colors
const getCategoryBgColor = (category: string): string => {
  switch (category) {
    case 'Physical':
      return "8B4513"; // Brown for physical
    case 'Pricing':
      return "2E8B57"; // Green for pricing
    case 'Paper':
      return "1E5391"; // Blue for paper
    case 'Exposure':
      return "3CB371"; // Light green for exposure
    default:
      return "1A1F2C"; // Default navy
  }
};

// Debug function to help identify formatting issues
const debugCellStyle = (style: any): void => {
  console.log("Cell style debug:", JSON.stringify(style, null, 2));
};

/**
 * Exports exposure data to Excel with proper formatting
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
  console.log("Starting Excel export with categories:", orderedVisibleCategories);
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Set column widths - ensure enough columns are defined
  const wscols = [
    { wch: 10 }, // Month column width
    ...Array(100).fill({ wch: 12 }) // Other columns - ensure enough are defined
  ];
  ws['!cols'] = wscols;
  
  // Add title with proper height and formatting
  const title = [["EXPOSURE REPORTING"]];
  XLSX.utils.sheet_add_aoa(ws, title, { origin: "A1" });
  
  // Apply title style and increase row height
  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 40 }; // Height for title row
  
  // Create a merged cell for the title spanning columns based on data
  if (!ws['!merges']) ws['!merges'] = [];
  
  // Calculate total columns for title merge
  let totalColumns = 1; // Start with 1 for Month column
  let productCountPerCategory: Record<string, number> = {};
  
  // Pre-calculate how many products are in each category for correct column spans
  orderedVisibleCategories.forEach(category => {
    const categoryProducts = filteredProducts.filter(product => 
      !(category === 'Physical' && ['ICE GASOIL FUTURES (EFP)', 'ICE GASOIL FUTURES', 'EFP'].includes(product)) &&
      !(category === 'Paper' && ['ICE GASOIL FUTURES (EFP)', 'EFP'].includes(product))
    );
    
    let colCount = categoryProducts.length;
    if (category === 'Exposure') {
      colCount += 3; // Add columns for Total Biodiesel, Total Pricing Instrument, and Total Row
    }
    
    productCountPerCategory[category] = colCount;
    totalColumns += colCount;
  });
  
  console.log("Total columns calculated:", totalColumns);
  console.log("Products per category:", productCountPerCategory);
  
  // Merge cells for title across all columns
  ws['!merges'].push({ 
    s: { r: 0, c: 0 }, 
    e: { r: 0, c: totalColumns > 1 ? totalColumns - 1 : 10 } 
  });
  
  // Apply title style explicitly to ensure it's visible
  if (!ws['!cells']) ws['!cells'] = {};
  ws['!cells']["A1"] = { 
    t: "s", 
    v: "EXPOSURE REPORTING", 
    s: titleStyle 
  };
  
  // NEW APPROACH: Build header rows WITHOUT merging for categories
  // This ensures all category headers remain visible
  
  // Generate header rows
  const headerRow1: string[] = ["Month"];
  let headerRow2: string[] = [""];
  
  // Fill first header row with category names repeated for each product
  orderedVisibleCategories.forEach(category => {
    const categoryProducts = filteredProducts.filter(product => 
      !(category === 'Physical' && ['ICE GASOIL FUTURES (EFP)', 'ICE GASOIL FUTURES', 'EFP'].includes(product)) &&
      !(category === 'Paper' && ['ICE GASOIL FUTURES (EFP)', 'EFP'].includes(product))
    );
    
    // Add category name for each product column (instead of merging)
    categoryProducts.forEach(() => {
      headerRow1.push(category);
    });
    
    // Add extra columns for Exposure category
    if (category === 'Exposure') {
      // Add for Total Biodiesel, Total Pricing Instrument, and Total Row
      headerRow1.push(category);
      headerRow1.push(category);
      headerRow1.push(category);
    }
    
    // Add product names to the second header row
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
  });
  
  console.log("Header row 1:", headerRow1);
  console.log("Header row 2:", headerRow2);
  
  // Add header rows to worksheet at the correct positions
  XLSX.utils.sheet_add_aoa(ws, [headerRow1], { origin: "A3" });
  XLSX.utils.sheet_add_aoa(ws, [headerRow2], { origin: "A4" });
  
  // Apply styles to each cell in header rows with appropriate background colors
  // First header row (categories)
  for (let i = 0; i < headerRow1.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: i });
    if (!ws['!cells']) ws['!cells'] = {};
    
    if (i === 0) {
      // Month header cell
      ws['!cells'][cellRef] = {
        t: "s",
        v: headerRow1[i],
        s: {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
          alignment: { horizontal: "left" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      };
    } else {
      // Category header cells with proper background color
      const category = headerRow1[i];
      const bgColor = getCategoryBgColor(category);
      
      ws['!cells'][cellRef] = {
        t: "s",
        v: headerRow1[i],
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: bgColor } },
          alignment: { horizontal: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      };
    }
  }
  
  // Apply styles to product header row (second header row)
  for (let i = 0; i < headerRow2.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 3, c: i });
    if (!ws['!cells']) ws['!cells'] = {};
    
    // Find which category this product belongs to
    let categoryForColumn = '';
    if (i > 0) {
      categoryForColumn = headerRow1[i]; // Use the category from the first header row
    }
    
    if (i === 0) {
      // First cell (blank in second row)
      ws['!cells'][cellRef] = {
        t: "s",
        v: headerRow2[i],
        s: {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
          alignment: { horizontal: "left" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      };
    } else {
      // Product header cells with category background color
      const bgColor = getCategoryBgColor(categoryForColumn);
      
      // For special headers in Exposure category
      let specialBackground = bgColor;
      if (categoryForColumn === 'Exposure' && 
          (headerRow2[i] === "Total Biodiesel" || 
           headerRow2[i] === "Total Pricing Instrument" || 
           headerRow2[i] === "Total Row")) {
        // Use slightly different colors for special headers
        if (headerRow2[i] === "Total Biodiesel") {
          specialBackground = "2E8B57"; // Green for biodiesel
        } else if (headerRow2[i] === "Total Pricing Instrument") {
          specialBackground = "1E5391"; // Blue for pricing instruments
        } else if (headerRow2[i] === "Total Row") {
          specialBackground = "4B5563"; // Dark gray for totals
        }
      }
      
      ws['!cells'][cellRef] = {
        t: "s",
        v: headerRow2[i],
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: specialBackground } },
          alignment: { horizontal: "right" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      };
    }
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
            s: {
              ...getExcelValueStyle(value),
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            }
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
            s: {
              ...getExcelValueStyle(value),
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            }
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
            s: {
              ...getExcelValueStyle(value),
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            }
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
            s: {
              ...getExcelValueStyle(value),
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            }
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
              s: {
                ...getExcelValueStyle(biodieselTotal),
                border: {
                  top: { style: "thin", color: { rgb: "000000" } },
                  bottom: { style: "thin", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } }
                }
              }
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
          s: {
            ...getExcelValueStyle(pricingInstrumentTotal),
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
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
          s: {
            ...getExcelValueStyle(totalRow),
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
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
      categoryProducts.forEach((product, index) => {
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
            font: { bold: true, color: getExcelValueStyle(value).font?.color },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
        };
        colIndex++;
      });
    } else if (category === 'Pricing') {
      categoryProducts.forEach((product, index) => {
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
            font: { bold: true, color: getExcelValueStyle(value).font?.color },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
        };
        colIndex++;
      });
    } else if (category === 'Paper') {
      categoryProducts.forEach((product, index) => {
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
            font: { bold: true, color: getExcelValueStyle(value).font?.color },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
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
            font: { bold: true, color: getExcelValueStyle(value).font?.color },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
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
              font: { bold: true, color: getExcelValueStyle(groupGrandTotals.biodieselTotal).font?.color },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
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
          font: { bold: true, color: getExcelValueStyle(groupGrandTotals.pricingInstrumentTotal).font?.color },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
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
          font: { bold: true, color: getExcelValueStyle(groupGrandTotals.totalRow).font?.color },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      };
      colIndex++;
    }
  });
  
  // Add Total row to the worksheet
  XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: `A${exposureData.length + 5}` });
  
  // Apply special styling to the Total row's first cell
  const totalLabelCellRef = XLSX.utils.encode_cell({ r: exposureData.length + 4, c: 0 });
  if (!ws['!cells']) ws['!cells'] = {};
  ws['!cells'][totalLabelCellRef] = {
    t: "s",
    v: "Total",
    s: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "4B5563" } },
      alignment: { horizontal: "left" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    }
  };
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Exposure Report");
  
  // Generate the Excel file name with the current date
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0];
  const fileName = `Exposure_Report_${formattedDate}.xlsx`;
  
  // Log final status before writing file
  console.log(`Excel export complete. Writing file: ${fileName}`);
  console.log(`Total cells styled: ${Object.keys(ws['!cells'] || {}).length}`);
  console.log(`Total merged cells: ${(ws['!merges'] || []).length}`);
  
  // Write and download the Excel file
  XLSX.writeFile(wb, fileName);
  
  console.log("Excel export finished successfully");
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

/**
 * Exports movement data to Excel with proper formatting
 */
export const exportMovementsToExcel = async () => {
  try {
    // Fetch movements data directly from Supabase
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[EXPORT] Error fetching movements:', error);
      throw new Error(`Error fetching movements: ${error.message}`);
    }
    
    if (!movements || movements.length === 0) {
      console.warn('[EXPORT] No movements data to export');
      return;
    }
    
    console.log(`[EXPORT] Successfully fetched ${movements.length} movements for export`);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Define column headers with uppercase formatting
    const headers = [
      'MOVEMENT REFERENCE NUMBER',
      'BUY/SELL',
      'INCOTERM',
      'SUSTAINABILITY',
      'PRODUCT',
      'LOADING START',
      'LOADING END',
      'COUNTERPARTY',
      'COMMENTS',
      'CREDIT STATUS',
      'SCHEDULED QUANTITY',
      'NOMINATION ETA',
      'NOMINATION VALID',
      'CASH FLOW DATE',
      'BARGE NAME',
      'LOADPORT',
      'LOADPORT INSPECTOR',
      'DISPORT',
      'DISPORT INSPECTOR',
      'BL DATE',
      'ACTUAL QUANTITY',
      'COD DATE',
      'STATUS'
    ];
    
    // Prepare data rows
    const rows = movements.map(movement => {
      return [
        movement.reference_number || '',
        movement.buy_sell || '',
        movement.inco_term || '',
        movement.sustainability || '',
        movement.product || '',
        movement.nomination_eta ? format(new Date(movement.nomination_eta), 'dd MMM yyyy') : '',
        movement.nomination_valid ? format(new Date(movement.nomination_valid), 'dd MMM yyyy') : '',
        movement.counterparty || '',
        movement.comments || '',
        movement.credit_status || '',
        movement.scheduled_quantity ? movement.scheduled_quantity.toString() : '',
        movement.nomination_eta ? format(new Date(movement.nomination_eta), 'dd MMM yyyy') : '',
        movement.nomination_valid ? format(new Date(movement.nomination_valid), 'dd MMM yyyy') : '',
        movement.cash_flow ? format(new Date(movement.cash_flow), 'dd MMM yyyy') : '',
        movement.barge_name || '',
        movement.loadport || '',
        movement.loadport_inspector || '',
        movement.disport || '',
        movement.disport_inspector || '',
        movement.bl_date ? format(new Date(movement.bl_date), 'dd MMM yyyy') : '',
        movement.actual_quantity ? movement.actual_quantity.toString() : '',
        movement.cod_date ? format(new Date(movement.cod_date), 'dd MMM yyyy') : '',
        movement.status || ''
      ];
    });
    
    // Add headers to the data
    const data = [headers, ...rows];
    
    // Create the worksheet and add data
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    const wscols = headers.map(() => ({ wch: 18 })); // Set a standard width for all columns
    ws['!cols'] = wscols;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Movements");
    
    // Generate the Excel file name with the current date
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const fileName = `Movements_${formattedDate}.xlsx`;
    
    // Write and download the Excel file
    XLSX.writeFile(wb, fileName);
    
    console.log(`[EXPORT] Successfully exported movements to ${fileName}`);
    return fileName;
  } catch (error) {
    console.error('[EXPORT] Error exporting movements to Excel:', error);
    throw error;
  }
};
