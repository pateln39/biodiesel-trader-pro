
import * as XLSX from 'xlsx';

/**
 * Creates cell styling with borders
 * @returns Default cell style with borders
 */
export const createDefaultCellStyle = () => {
  return {
    border: {
      top: { style: 'thin', color: { auto: 1 } },
      bottom: { style: 'thin', color: { auto: 1 } },
      left: { style: 'thin', color: { auto: 1 } },
      right: { style: 'thin', color: { auto: 1 } }
    }
  };
};

/**
 * Apply styles to all cells in a worksheet
 * @param worksheet - The worksheet to style
 * @param headerRowCount - Number of header rows to style differently
 * @param includeFooter - Whether to style the last row as a footer
 */
export const applyWorksheetStyles = (
  worksheet: XLSX.WorkSheet, 
  headerRowCount: number = 1,
  includeFooter: boolean = false
) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const defaultStyle = createDefaultCellStyle();
  
  // Apply styles to all cells
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell_ref = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' };
      if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};
      Object.assign(worksheet[cell_ref].s, defaultStyle);
      
      // Apply header styles
      if (r < headerRowCount) {
        worksheet[cell_ref].s.font = { bold: true };
        worksheet[cell_ref].s.fill = {
          patternType: 'solid',
          fgColor: { rgb: "DDDDDD" }
        };
      }
      
      // Apply footer styles if applicable
      if (includeFooter && r === range.e.r) {
        worksheet[cell_ref].s.font = { bold: true };
        worksheet[cell_ref].s.fill = {
          patternType: 'solid',
          fgColor: { rgb: "EEEEEE" }
        };
      }
    }
  }
};

/**
 * Apply cell merging to worksheet
 * @param worksheet - The worksheet to apply merges to
 * @param mergeRanges - Array of merge ranges: {s: {r, c}, e: {r, c}}
 */
export const applyCellMerges = (
  worksheet: XLSX.WorkSheet,
  mergeRanges: { s: { r: number, c: number }, e: { r: number, c: number } }[]
) => {
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  mergeRanges.forEach(range => {
    worksheet['!merges'].push(range);
  });
};

/**
 * Set column widths for a worksheet
 * @param worksheet - The worksheet to set column widths for
 * @param widths - Array of column width values
 */
export const setColumnWidths = (
  worksheet: XLSX.WorkSheet,
  widths: number[]
) => {
  worksheet['!cols'] = widths.map(wch => ({ wch }));
};

/**
 * Generate Excel file name with current date
 * @param prefix - Prefix for the file name
 * @returns Formatted file name string with date
 */
export const generateExcelFileName = (prefix: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${prefix}_${year}-${month}-${day}.xlsx`;
};

// Add missing style definitions that are used in exposureTableExport.ts
export const columnHeaderBorderStyle = {
  font: { bold: true },
  fill: { patternType: 'solid', fgColor: { rgb: "DDDDDD" } },
  border: {
    top: { style: 'thin', color: { auto: 1 } },
    bottom: { style: 'thin', color: { auto: 1 } },
    left: { style: 'thin', color: { auto: 1 } },
    right: { style: 'thin', color: { auto: 1 } }
  },
  alignment: { horizontal: 'center' }
};

export const dataBorderStyle = {
  border: {
    top: { style: 'thin', color: { auto: 1 } },
    bottom: { style: 'thin', color: { auto: 1 } },
    left: { style: 'thin', color: { auto: 1 } },
    right: { style: 'thin', color: { auto: 1 } }
  },
  alignment: { horizontal: 'right' }
};

export const sumRowBorderStyle = {
  font: { bold: true },
  border: {
    top: { style: 'thin', color: { auto: 1 } },
    bottom: { style: 'thin', color: { auto: 1 } },
    left: { style: 'thin', color: { auto: 1 } },
    right: { style: 'thin', color: { auto: 1 } }
  },
  fill: { patternType: 'solid', fgColor: { rgb: "EEEEEE" } },
  alignment: { horizontal: 'right' }
};

export const totalRowBorderStyle = {
  font: { bold: true },
  border: {
    top: { style: 'thin', color: { auto: 1 } },
    bottom: { style: 'thin', color: { auto: 1 } },
    left: { style: 'thin', color: { auto: 1 } },
    right: { style: 'thin', color: { auto: 1 } }
  },
  fill: { patternType: 'solid', fgColor: { rgb: "E0E0E0" } },
  alignment: { horizontal: 'right' }
};

export const exportStyles = {
  header: columnHeaderBorderStyle,
  data: dataBorderStyle,
  sumRow: sumRowBorderStyle,
  totalRow: totalRowBorderStyle
};

/**
 * Add conditional formatting based on value
 * @param value - Number to evaluate for formatting
 * @param baseStyle - Base style to apply conditional formatting on top of
 * @returns Style object with conditional formatting applied
 */
export const addConditionalStyle = (value: number, baseStyle: any) => {
  const style = { ...baseStyle };
  
  if (value > 0) {
    style.font = { ...style.font, color: { rgb: "008800" } }; // Green for positive values
  } else if (value < 0) {
    style.font = { ...style.font, color: { rgb: "880000" } }; // Red for negative values
  }
  
  return style;
};
